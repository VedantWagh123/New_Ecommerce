import express from "express";
import { 
    listBankOffers, 
    addBankOffer, 
    toggleBankOfferStatus, 
    deleteBankOffer 
} from "../controllers/bankOfferController.js";

const bankOfferRouter = express.Router();

bankOfferRouter.get('/list', listBankOffers);
bankOfferRouter.post('/add', addBankOffer);
bankOfferRouter.post('/toggle', toggleBankOfferStatus);
bankOfferRouter.post('/delete', deleteBankOffer);

export default bankOfferRouter;
