// Vercel Serverless entry point
const { app, connectDB } = require('../APP/backend/app');
const { getInstance: getAuthService } = require('../APP/backend/src/services/auth-service');

let initialized = false;

module.exports = async (req, res) => {
    // Conectar a DB y inicializar admin en la primera invocación
    if (!initialized) {
        await connectDB();
        await getAuthService().initializeDefaultAdmin();
        initialized = true;
    }

    return app(req, res);
};
