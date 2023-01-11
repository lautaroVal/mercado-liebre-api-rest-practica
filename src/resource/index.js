const objectValidate = (args,msg) => ({args,msg});

const defaultValidationsRequiredFields = {
    notNull: objectValidate(true,"No puede ser nulo."),
    notEmpty: objectValidate(true,"No puede ser nulo.")
}


module.exports = { objectValidate, defaultValidationsRequiredFields}