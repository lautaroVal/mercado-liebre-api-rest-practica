const { verify } = require('jsonwebtoken')

const checkToken = async (req,res,next) => {
    try {
        /* Guardamos el token si viaja por headers o params */
        const token = req.header('Authorization') || req.params.token
        /* Si el token no existe mandamos msg error */
        if (!token) {
            return res.status(401).json({
                ok:false,
                status:401,
                msg: "El token es requerido"
            })
        }
        /* Decodificamos el objeto que mandomos como token */
        const decoded = verify(token,process.env.SECRET_KEY_JWT)
        req.userToken = decoded  /*  { id, rolId } */

        next()

    } catch (error) {
        return res.status(403).json({
            ok:false,
            status:403,
            msg: error.message || 'Error en el token'
          })
    }
} 

module.exports = {
    checkToken
}
