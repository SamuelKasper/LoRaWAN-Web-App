"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const app = (0, express_1.default)();
const port = 8000;
/*app.get("/", (req, res) => {
    res.send("Hello!");
});*/
app.use(express_1.default.static("public"));
/*app.listen(port, () =>{
    console.log(`listening on ${port}`);
});*/
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        const uri = "mongodb+srv://samuelnoahkasper:T8Ugwdh9ZhFEe77v@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority";
        const client = new mongodb_1.MongoClient(uri);
        try {
            yield client.connect();
            yield listDB(client);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            yield client.close();
        }
    });
}
function listDB(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const dbList = yield client.db().admin().listDatabases();
        dbList.databases.forEach(db => {
            console.log(db.name);
        });
    });
}
connectDB();
