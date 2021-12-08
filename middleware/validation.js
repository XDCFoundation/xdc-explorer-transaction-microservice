import Utils from '../app/utils'
import * as yup from 'yup'

module.exports = {
  validateQuery: async (req, res, next) => {
    const schema = yup.object().shape({
      skip: yup.number().required(),
      limit: yup.number().required()
    })
    await validate(schema, req.query, res, next)
  }

}


const validate = async (schema, reqData, res, next) => {
  try {
    await schema.validate(reqData, { abortEarly: false })
    next()
  } catch (e) {
    const errors = e.inner.map(({ path, message, value }) => ({ path, message, value }))
    Utils.responseForValidation(res, errors)
  }
}
