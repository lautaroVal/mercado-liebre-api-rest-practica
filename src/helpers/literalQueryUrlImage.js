const {literal} = require('sequelize');

const literalQueryUrlImage = (req, field,alias, pathRoute = '/products') => {
    const urlImage = () => `${req.protocol}://${req.get("host")}${pathRoute}/image/`;

    return [literal(`CONCAT( '${urlImage()}', ${field} )`), alias];
    
}

module.exports = { literalQueryUrlImage }