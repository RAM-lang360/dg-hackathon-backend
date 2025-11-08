class model {
    constructor() {
        this.indicatorHL = [];
    }
}

function getOrder() {
    const filePath = path.join(__dirname, "../data/orders.json");
    const jsonData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(jsonData);
}