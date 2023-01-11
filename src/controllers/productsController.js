const { unlinkSync } = require('fs');
const path = require('path');
const { literal, Op } = require('sequelize');
const db = require('../database/models');
const { literalQueryUrlImage } = require('../helpers/literalQueryUrlImage');
const { sendJsonError } = require('../helpers/sendJsonError');
const controller = {

  // API -> GET IMAGE IN VIEW
  image: (req, res) => {
    res.sendFile(
      path.join(__dirname, `../../public/images/products/${req.params.img}`)
    )
  },

  // API -> ALL PRODUCTS + QUERIES
  all: async (req, res) => {
    try {
      let {page = 1,limit = 5,offset = 0, sales = 0, salesDiscount = 10, price = 0, order= 'ASC', sortBy = 'name', search = ""} = req.query;

      const typeSort = ['id','name','price','discount','category','newest'];

      /* COMPROBACIONES */

      limit = +limit > 5 ? 5 : +limit;

      salesDiscount = +salesDiscount < 10 ? 10 : +salesDiscount;

      sortBy = typeSort.includes(sortBy) ? sortBy : 'id';
      
      page = +page <= 0 || isNaN(page) ? 1 : +page;

      /* -------------------------- */
      /*        URL QUERIES         */
      const queriesValuesDefaultAndModify = {
        limit,
        sales,
        salesDiscount,
        price,
        order,
        sortBy,
        search
      }

      let urlQuery = ''
      let queries = queriesValuesDefaultAndModify;

      for (const key in queries) {
        urlQuery += `&${key}=${queries[key]}`
      } 
      //console.log(urlQuery);

      page -= 1;

      offset = page * limit;
    
      const orderQuery = sortBy === "category" ? [[ "category","name",order ]] : sortBy === "newest" ? [[ "createdAt", "desc" ]] : [[sortBy,order]];

      let options = {
        limit,
        offset,
        include:[{                   
          association: 'images',
          attributes: {
            exclude:['file','updatedAt','createdAt','deletedAt'],
            include:[[literal(`CONCAT( '${req.protocol}://${req.get('host')}/products/image/',images.file )`),'urlImage']]
          } 
        }, {
          association: 'category',
          attributes: {              
            exclude:['updatedAt','createdAt','deletedAt'],
          }
        }],
        attributes: {              
          exclude:['updatedAt','deletedAt'],
        },
        order: orderQuery,
        where: {
          [Op.or]: [
            {
              name: {
                [Op.substring]: search
              }
            },
            {
              description: {
                [Op.substring]: search
              }
            }
          ]
        }
      }

      const optionSales = {
        ...options,
        where: {
          discount: {
            [Op.gte]: salesDiscount
          }
        }
      }
      
      if (+sales === 1 && !isNaN(sales)) {
        options = optionSales
      }

      const optionPrice = {
        ...options,
        where: {
          price: {
            [Op.gte]: price
          }
        }
      }

      if (+price && !isNaN(price)) {
        options = optionPrice;
      }

      const {count, rows: products} = await db.Product.findAndCountAll(options);

      if (!products.length) {
        return res.status(200).json({
          ok:true,
          status:204,
          message:"No hay productos en esta página"
        })
      }

      const existPrev = page > 0 && offset <= count;

                      // Si el total de páginas es mayor que la página consultada Existe Next!
      const existNext = Math.floor(count / limit) >= (page + 1);      // Math.floor redondea para abajo
                     // 20 / 5 = 4 (total páginas)  
      let urlPrev = null;
      let urlNext = null;

      if (existPrev) {
        urlPrev = `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${page}${urlQuery}`  }

      if (existNext) {
        urlNext = `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${page + 2}${urlQuery}`  }

      return res.status(200).json({
        meta: {
          ok:true,
          status:200,
        },
        data: {
          totalProducts: count,
          prev: urlPrev,
          next: urlNext,
          products,
        }
      });

    } catch (error) {
      sendJsonError(error,res)
    }

  },

  // API -> DETAIL PRODUCT
  detail: async (req, res) => {

    let options = {
      include:[{                   
        association: 'images',
        attributes: {
          exclude:['file','updatedAt','createdAt','deletedAt'],
          include: [ literalQueryUrlImage(req,'file','file')]
          //[[literal(`CONCAT( '${req.protocol}://${req.get('host')}/products/image/',images.file )`),'urlImage']]
        } 
      }, {
        association: 'category',
        attributes: {              
          exclude:['updatedAt','createdAt','deletedAt'],
        }
      }],
      attributes: {              
        exclude:['updatedAt','deletedAt','createdAt'],
      }
    }

    try {
      const idProduct = req.params.id;
      if (isNaN(idProduct)) {
        return sendJsonError("El parámetro es inválido",res)
      }

      const product = await db.Product.findByPk(req.params.id, options);

      if (!product) {
        sendJsonError("El producto solicitado no existe",res,404)
      }

      res.status(200).json({
        ok:true,
        status:200,
        data:product
      })

    } catch (error) {
      sendJsonError(error,res)
    }
   },

  // API -> STORAGE PRODUCT
  store: async (req, res) => { 

    try {
      const { name, price, discount, description, categoryId} = req.body;

      const product = await db.Product.create({
        name: name?.trim(),
        description: description?.trim(),
        price: +price,
        discount: +discount,
        categoryId: +categoryId
      })

      console.log(product);

      let images = [{ productId: product.id }];

      if (req.files?.length) {
        images = req.files.map((file) => {
          return {
            productId: product.id,
            file: file.filename,
          }
        })
      }

      await db.Image.bulkCreate(images, {validate:true});

      await product.reload({
        include:[{
          association: "images",
          attributes: {
            exclude: ["createdAt","updatedAt","deletedAt"]
          }
        },{
          association: "category",
          attributes: {
            exclude: ["createdAt","updatedAt","deletedAt"]
          }
        }],
        attributes: {
          exclude: ["createdAt","updatedAt","deletedAt"]
        }
    })

      return res.status(201).json({
        ok:true,
        status:201,
        data: product,
      })


    } catch (error) {
      sendJsonError(error,res)
    }

  },

  // API -> UPDATE PRODUCT
  update: async (req, res) => {
    try {
      const {name,price,discount,description,categoryId} = req.body;
      const { id } = req.params;
      const { deletePreviousImages } = req.query;
      
      const product = await db.Product.findByPk(id,{
        include:[{
          association: "images",
          attributes: {
            exclude: ["createdAt","updatedAt","deletedAt"]
          }
        },{
          association: "category",
          attributes: {
            exclude: ["createdAt","updatedAt","deletedAt"]
          }
        }],
        attributes: {
          exclude: ["createdAt","updatedAt","deletedAt"]
        }
    })
    
    product.name = name?.trim() || product.name
    product.price = +price || product.price
    product.discount = +discount || product.discount
    product.description = description?.trim() || product.description
    product.categoryId = +categoryId || product.categoryId

    await product.save()

    if (+deletePreviousImages === 1) {
      product.images.forEach(async (img) => {
        await img.destroy();
        unlinkSync(path.join(__dirname, `../../public/images/products/${img.file}`))
      });
    }

    if (req.files?.length) {
      const images = req.files.map((file) => {
        return {
          file: file.filename,
          productId: product.id
        }
      })

      await db.Image.bulkCreate(images, {validate:true})
    }

    res.status(200).json({
      ok:true,
      status:200,
      /* data: await product.reload() */
      url: `${req.protocol}://${req.get('host')}/products/${product.id}`
    })

    } catch (error) {
      sendJsonError(error,res)
    }

  },

  // API -> DELETE PRODUCT
  destroy: async (req, res) => {
    const {id} = req.params;

    try {
      /* await db.Image.destroy({where:{ productId: id }})
      await db.Product.destroy({where:{id}}) */

      const options = {
        include:[{
          association: "images",
          attributes: {
            exclude: ["createdAt","updatedAt","deletedAt"]
          }
        },{
          association: "category",
          attributes: {
            exclude: ["createdAt","updatedAt","deletedAt"]
          }
        }],
        attributes: {
          exclude: ["createdAt","updatedAt","deletedAt"]
        }
    }

      const product = await db.Product.findByPk(id,options)

      product.images.forEach(async (img) => {
        await img.destroy();
        unlinkSync(path.join(__dirname, `../../public/images/products/${img.file}`))
      });
      await product.destroy()

      res.status(200).json({
        ok:true,
        status:200,
        msg: "Producto eliminado"
      })

    } catch (error) {
      sendJsonError(error,res)
    }
   },
};

module.exports = controller;
