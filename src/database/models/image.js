"use strict";
const { Model } = require("sequelize");
const { join } = require("path");
const { objectValidate, defaultValidationsRequiredFields } = require("../../resource");
const { unlinkSync } = require("fs");
module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    static associate(models) {
      // define association here
      Image.belongsTo(models.Product, {
        as: "product",
        foreignKey: "productId",
        onDelete: "CASCADE",
      });
    }
  }
  Image.init(
    {
      file: {
        type: DataTypes.STRING,
        defaultValue: 'default.png',
        validate: {
          isImage(value){
            if (!/.png|.jpg|.jpeg|.webp/i.test(value)) {
              unlinkSync(join(__dirname, '../../../public/images/products/' + value));
              throw new Error("Archivo inválido")
            }
          }
        }
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          ...defaultValidationsRequiredFields,
          is: objectValidate(/[0-9]/, "Valor inválido")
        }
      },
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Image",
      paranoid: true,
    }
  );

  return Image;
};
