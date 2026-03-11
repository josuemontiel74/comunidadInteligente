import tipodocumento from "../models/tipoDocumento.model.js";

export const mostraDocumentos = async (req, res) => {
  try {
    await tipodocumento.sync();
    const mostraDocumentos = await tipodocumento.findAll();
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
  try {
    const { idTipoDocumento } = req.params;

    const mostraDocumentos = await tipodocumento.findOne({
      where: { idTipoDocumento: idTipoDocumento },
    });

    if (!mostraDocumentos) {
      return res.status(404).json({
        message: "No se encontró el documento",
        status: 404,
      });
    }

    res.status(200).json({
      message: "Documento encontrado",
      status: 200,
      body: mostraDocumentos,
    });
  } catch (error) {
    res.status(500).json({
      message: "Algo salió mal, no se puede mostrar el documento",
      status: 500,
      error: error.message,
    });
  }
}; 
