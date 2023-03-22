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
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
let connection;
let db;
function connectToDB() {
    return __awaiter(this, void 0, void 0, function* () {
        const connectionString = process.env.DATABASE_URL || "";
        const client = new mongodb_1.MongoClient(connectionString);
        try {
            connection = yield client.connect();
        }
        catch (e) {
            console.error(e);
        }
        db = connection.db("lorawan_data");
    });
}
exports.default = db;
