import Utils from '../../utils'
import CurrentTPSModel from "../../models/currentTPS";
import MaxtpsModel from "../../models/maxTPS";


export default class Manger {
  
    getCurrentTPS = async()=>{
        Utils.lhtLog("BLManager:getCurrentTPS", "getCurrentTPS", "", "");
        return await CurrentTPSModel.findOne({})       
    }

    getMaxTPS = async()=> {
        Utils.lhtLog("BLManager:maxTPS", "maxTPS", "", "");
        return await MaxtpsModel.findOne({})
    }

}
