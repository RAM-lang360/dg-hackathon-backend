class Model {
    raw_data: any;

    constructor() {
        this.raw_data = {};
    }

    async getRawData() {
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        this.raw_data = data;
    }
}