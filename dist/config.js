"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.expandHome = expandHome;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const yaml_1 = __importDefault(require("yaml"));
async function loadConfig() {
    const yaml = await promises_1.default.readFile("config.yaml", "utf8");
    return yaml_1.default.parse(yaml);
}
function expandHome(value) {
    if (value.startsWith("~/")) {
        return node_path_1.default.join(node_os_1.default.homedir(), value.slice(2));
    }
    return value;
}
