const path = require('path');
const db = require("../database/models");
const { literalQueryUrlImage } = require('../helpers/literalQueryUrlImage');

module.exports = {
  // API -> GET IMAGE IN VIEW
  image: (req, res) => {
    res.sendFile(path.join(__dirname,`../../public/images/avatars/${req.params.img}`))
  },

  update: async (req, res) => {
    const {id} = req.userToken;
    const {name,surname,street,city,province} = req.body;

    try {
      const options = {
        include:[{                   /* Incluimos relación addresses en la consulta de usuario  */
          association: 'addresses',
          attributes: {
            exclude:['userId','deletedAt']   /* Excluimos estos attributo del modelo addresses */
          } 
        }],
        attributes: {               /* Excluimos attributos principales de la consulta */
          exclude:['deletedAt','password'],
          include:[ literalQueryUrlImage(req,"avatar","avatar","/users")]
        }       /* Incluimos la url de la imagen armada con el CONCAT */
      }
      /* Consultamos el usuairo por id */
      const user = await db.User.findByPk(id,options);
      /* Actualizamos datos del usuairo */
      user.name = name?.trim() || user.name;
      user.surname = surname?.trim() || user.surname
      user.avatar = req.file?.filename || user.avatar
      /* Buscamos la direcciòn del usuario que està activa */
      const indexAddressActive = user.addresses.findIndex(address => address.active);
      const address = user.addresses[indexAddressActive];
      /* Actualizamos los datos de la direcciòn con el ìndice activo */
      address.street = street?.trim() || address.street
      address.city = city?.trim() || address.city
      address.province = province?.trim() || address.province
      /* Guardamos los datos actualizados en base de datos */
      await user.save()
      await address.save()

      return res.status(200).json({
        ok:true,
        status:200,
        data: user,
      })

    } catch (error) {
      res.status(500).json({
        ok:false,
        status:500,
        msg: error.message || "Ocurrió un error."
      })
    }
  },

  remove: async (req, res) => {
    try {
      const userId = req.params.id || req.userToken.id;
      const removeUser = await db.User.destroy({where: {id: userId}}); /* Destruyo usuario con sus direcciones por id o token */
      const removeAddress = await db.Address.destroy({where: {userId}}); /* userId : userId */

      if (!removeUser || !removeAddress) {      /* Si no borró usuario o dirección mando res y msg. */
        return res.status(404).json({
          ok:false,
          status:404,
          msg: "Es posible de que el usuario no exista"
        })
      }

      return res.status(200).json({
        ok:true,
        status:200
      })
      
    } catch (error) {
      res.status(500).json({
        ok:false,
        status:500,
        msg: error.message || "Server error."
      })
    }
   
    }
};
