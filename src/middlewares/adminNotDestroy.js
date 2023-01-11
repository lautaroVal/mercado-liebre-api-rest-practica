const { ID_ADMIN } = require('../constants');

const adminNotDestroy = (req,res,next) => {

    const userIdParams = +req.params.id;
    const { id } = req.userToken;
     /* Si existe il ID del parámaetro y es el Administrador o No existe el Id params y el ID del token es Administrador mando error y msg*/
    if (userIdParams && userIdParams === ID_ADMIN || (!userIdParams && id === ID_ADMIN)) {
        return res.status(400).json({
            ok:false,
            status:400,
            msg:"Este usuario no puede auto eliminarse"
        });
    }
    next()
};

module.exports = {adminNotDestroy}