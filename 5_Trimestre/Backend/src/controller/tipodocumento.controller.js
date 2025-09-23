import tipoDocumentoModel from "../models/tipodocumento.model.js";

export const mostraDocumentos = async (req, res) => {
  try {
    await tipoDocumentoModel.sync();
    const mostraDocumentos = await tipoDocumentoModel.findAll();
    res.status(200).json({
      message: "Documentos",
      status: 200,
      body: mostraDocumentos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar los tipos de datos",
      status: 500,
      error: error.message,
    });
  }
};

export const mostraDocumentosporId = async (req, res) => {
  const { id } = req.params;
  try {
    await tipoDocumentoModel.sync();
    const mostraDocumentos = await tipoDocumentoModel.findOne({
      where: { idTipoDocumento: id },
    });
    res.status(200).json({
      message: "Documento encontrado",
      status: 200,
      body: mostraDocumentos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salio mal, No se puede mostrar el documento",
      status: 500,
      error: error.message,
    });
  }
};
