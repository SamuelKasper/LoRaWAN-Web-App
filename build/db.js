"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const Http = __importStar(require("http"));
let server = Http.createServer();
server.addListener("request", handleRequest);
server.listen(8000);
let temp = "";
function handleRequest(_request, _response) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Test");
        _response.setHeader("content-type", "text/html; charset=utf-8");
        _response.setHeader("Access-Control-Allow-Origin", "*");
        yield connectDB();
        _response.write(temp);
        _response.end();
    });
}
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        const uri = "mongodb+srv://samuelnoahkasper:T8Ugwdh9ZhFEe77v@mycluster.fnu9yyz.mongodb.net/?retryWrites=true&w=majority";
        const client = new mongodb_1.MongoClient(uri);
        try {
            yield client.connect();
            yield getEntries(client);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            yield client.close();
        }
    });
}
function getEntries(client) {
    return __awaiter(this, void 0, void 0, function* () {
        const db_entries = client.db("lorawan_data").collection("sensor_data");
        let entries = yield db_entries.find().toArray();
        entries.forEach(i => {
            console.log("\n");
            console.log("ID: " + i._id + "\ntemperature: " + i.temperature + "\nhumidity: " + i.humidity);
            temp = "ID: " + i._id + "\ntemperature: " + i.temperature + "\nhumidity: " + i.humidity;
        });
    });
}
