export default (schema, property = "body") => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req[property], { abortEarly: false });
      next();
    } catch (err) {
      return res.status(400).json({
        errors: err.details ? err.details.map((d) => d.message) : [err.message],
      });
    }
  };
};
