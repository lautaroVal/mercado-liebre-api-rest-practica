"use strict";
const { hashSync } = require("bcryptjs");
const { Model } = require("sequelize");
const { ROL_USER } = require("../../constants");
const { objectValidate, defaultValidationsRequiredFields } = require("../../resource");
const {unlinkSync} = require("fs");
const {join} = require("path")


module.exports = (sequelize, DataTypes) => {
  class User extends Model {

    existEmail(value){
      return new Promise((resolve) => {
        const user = User.findOne({where: {email:value}})
        resolve(user)
      })
    }

    static associate(models) {
      // define association here
      /* Tiene muchas direcciones */
      this.hasMany(models.Address, {
        foreignKey: "userId",
        as: "addresses",
      });
      /* Tiene un rol */
      this.belongsTo(models.Rol, {
        foreignKey: "rolId",
        as: "rol",
      });
    }
  }

  User.init(
    {
      /* datatypes y validations */
      /* NAME */
      name: {
        type: DataTypes.STRING,
        validate: {
          is: objectValidate(/^[a-z]+$/i,"No puede tener números (name).")
        }
      },

      // SURNAME
      surname: {
        type: DataTypes.STRING,
        validate: {
          is: objectValidate(/^[a-z]+$/i,"No puede tener números (surname).")
        }
      },

      // EMAIL
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate : {
          ...defaultValidationsRequiredFields,
          isEmail: objectValidate(true,"Ingrese un email válido (email)."),
          /* CUSTOM VALIDATOR -> SEQUELIZE */
          async email(value) {  /* email@email.com */
              const exist = await this.existEmail(value);
              if (exist) {
                throw new Error("El email ya existe.")
              }
          }
        }
      },

      // PASSWORD
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate : {
          ...defaultValidationsRequiredFields,
          /* isAlphanumeric: objectValidate(true,"Contraseña inválida, solo números y letras"),
          len: objectValidate([10,30], "Longitud inválida, (más de 10 y menos de 30)"), */
          is: objectValidate(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/, "La contraseña debe tener entre 8 y 16 caracteres, al menos un dígito, al menos una minúscula y al menos una mayúscula."),
          /* CUSTOM */
          hassPass(value){
            User.beforeCreate((user) => {
              user.password = hashSync(value)
            })
          }
      }
    },

      // AVATAR
      avatar: {
        type: DataTypes.STRING,
        defaultValue: "default.png",
        validate: {
          isImage(value){
            if (!/.png|.jpg|.jpeg|.webp/i.test(value)) {
              unlinkSync(join(__dirname, '../../../public/images/avatars/' + value));
              throw new Error("Archivo inválido")
            }
          }
        }
      },

      // ROL ID
      rolId: {
        type: DataTypes.INTEGER,
        valueDefault: ROL_USER,
      },
    },
    {
      sequelize,
      modelName: "User",
      paranoid: true,
    }
  );

  return User;
};
