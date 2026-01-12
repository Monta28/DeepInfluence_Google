const prisma = require('../../services/database');

// Default currency configuration
const DEFAULT_CURRENCY = {
  code: 'TND',
  symbol: 'TND',
  name: 'Dinar Tunisien',
  position: 'after'
};

// Get currency settings (public endpoint)
const getCurrency = async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'currency' }
    });

    if (setting) {
      const currency = JSON.parse(setting.value);
      return res.json({ success: true, data: currency });
    }

    // Return default if not set
    return res.json({ success: true, data: DEFAULT_CURRENCY });
  } catch (error) {
    console.error('Get currency error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Update currency settings (admin only)
const updateCurrency = async (req, res) => {
  try {
    const { code, symbol, name, position } = req.body;

    if (!code || !symbol || !name) {
      return res.status(400).json({
        success: false,
        message: 'Code, symbole et nom de la devise requis'
      });
    }

    const currencyData = {
      code,
      symbol,
      name,
      position: position || 'after'
    };

    const setting = await prisma.setting.upsert({
      where: { key: 'currency' },
      update: { value: JSON.stringify(currencyData) },
      create: { key: 'currency', value: JSON.stringify(currencyData) }
    });

    return res.json({
      success: true,
      message: 'Devise mise a jour',
      data: currencyData
    });
  } catch (error) {
    console.error('Update currency error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Get all settings (admin only)
const getAllSettings = async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();

    const settingsMap = {};
    for (const setting of settings) {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    }

    // Add defaults for missing settings
    if (!settingsMap.currency) {
      settingsMap.currency = DEFAULT_CURRENCY;
    }

    return res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Get all settings error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Update a setting (admin only)
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Cle et valeur requis'
      });
    }

    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: valueStr },
      create: { key, value: valueStr }
    });

    return res.json({
      success: true,
      message: 'Parametre mis a jour',
      data: { key, value }
    });
  } catch (error) {
    console.error('Update setting error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getCurrency,
  updateCurrency,
  getAllSettings,
  updateSetting,
  DEFAULT_CURRENCY
};
