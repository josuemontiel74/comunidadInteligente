const validateSchema = (schema, property = "body") => {
  return async (req, res, next) => {
    try {
      const validated = await schema.validateAsync(req[property], {
        abortEarly: false,
        convert: true,
      });
      req[property] = validated;
      next();
    } catch (err) {
      return res.status(400).json({
        errors: err.details ? err.details.map((d) => d.message) : [err.message],
      });
    }
  };
};

export default validateSchema;
