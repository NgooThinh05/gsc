import * as contractsPdfService from '../services/contracts-pdf.service.js';

export async function downloadContractPdf(req, res, next) {
  try {
    const contractId = req.params.id;
    const doc = await contractsPdfService.generateContractPdf(contractId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="HopDong_${contractId}.pdf"`);

    const stream = await doc.getStream();
    stream.pipe(res);
    stream.end();
  } catch (error) {
    return next(error);
  }
}
