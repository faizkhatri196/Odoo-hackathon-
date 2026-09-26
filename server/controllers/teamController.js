const User = require('../models/User');
const Warehouse = require('../models/Warehouse');

/**
 * Get all team members of the authenticated user's company
 * GET /api/team
 */
exports.getTeamMembers = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.user?.company) {
      filter.company = req.user.company;
    }

    const members = await User.find(filter)
      .select('-password')
      .populate('warehouse', 'name code location')
      .populate('company', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign / Create a new team member (Inventory Manager or Warehouse Staff)
 * POST /api/team
 */
exports.createTeamMember = async (req, res, next) => {
  try {
    const { name, email, password, role, warehouse } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required',
      });
    }

    if (!['inventory_manager', 'warehouse_staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "inventory_manager" or "warehouse_staff"',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `User with email "${normalizedEmail}" is already registered`,
      });
    }

    // Verify warehouse belongs to this company if specified
    if (warehouse && req.user?.company) {
      const whExists = await Warehouse.findOne({ _id: warehouse, company: req.user.company });
      if (!whExists) {
        return res.status(400).json({
          success: false,
          message: 'Selected warehouse is invalid or does not belong to your company',
        });
      }
    }

    const newMember = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      company: req.user?.company || null,
      companyName: req.user?.companyName || '',
      warehouse: warehouse || null,
      isActive: true,
    });

    const populated = await User.findById(newMember._id)
      .select('-password')
      .populate('warehouse', 'name code');

    res.status(201).json({
      success: true,
      message: `Successfully assigned ${role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'} ${newMember.name}`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove / Deactivate team member
 * DELETE /api/team/:id
 */
exports.removeTeamMember = async (req, res, next) => {
  try {
    const member = await User.findOne({
      _id: req.params.id,
      company: req.user?.company,
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    if (member._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own administrative account' });
    }

    member.isActive = false;
    await member.save();

    res.json({
      success: true,
      message: 'Team member access revoked successfully',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};
