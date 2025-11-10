import { WeightsType } from "./types/dataview";

export default class View {
    indicatorHL: WeightsType;
    constructor() {
        this.indicatorHL = {};
    }
    setIndicatorHL(data: WeightsType) {
        this.indicatorHL = data;
    }



}

// function getOrder() {
//     const filePath = path.join(__dirname, "../data/orders.json");
//     const jsonData = fs.readFileSync(filePath, "utf8");
//     return JSON.parse(jsonData);
// }