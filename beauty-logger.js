'use strict'

const list = []
, 	LOGGER_LEVEL = ["debug", "info", "warn", "error"]
, 	isNodeJs = typeof(process) === 'object'

let loopTimes = 0
,	userConfig = {}
,	LOG_FILE_MAX_SIZE = 1024 * 1024 * 10
,	ENABLE_DATA_TYPE_WARN = false
,	LOG_PATH = isNodeJs ? require('path').join(__dirname, "../../server.log") : ""
,	PRODUCTION_MODEL = false
,	fs
,	path
,	deepcopy

if(typeof require === 'function'){
	fs = require('fs'),
	path = require('path'),
	deepcopy = require('./deepcopy')
}

//自定义控制台颜色输出
{
	const colors = {
		Reset: "\x1b[0m",
		FgRed: "\x1b[31m",
		FgGreen: "\x1b[32m",
		FgYellow: isNodeJs ? "\x1b[33m": "\x1b[43m",
		FgBlue: "\x1b[34m"
	};
	"debug:debug:FgBlue,info:info:FgGreen,warn:warn:FgYellow,error:error:FgRed".split(",").forEach(function (logColor) {
		const [log, info, color] = logColor.split(':');
		const logger = function (...args) {
			console.log(...args)
		}
		console[log] = (...args) => logger.apply(null, [`${colors[color]}[${getTime()}] [${info.toUpperCase()}]${colors.Reset} `, ...args, isNodeJs ? colors.Reset : ""]);
	});
}

function dealWithItems(item, needWarn) {
	try {
		const dist = deepcopy(item);
		return JSON.stringify(dist, function (key, value) {
			return formatDataType(value, needWarn)
		}, 4)
	} catch (err) {
		return Object.prototype.toString.call(item)
	}
}
function formatDataType(value, needWarn) {
	loopTimes++
	let formattedOnes = ""
	try {
		const valueType = Object.prototype.toString.call(value)
		switch (valueType) {
			case '[object Number]':
			case '[object String]':
			case '[object Undefined]':
			case '[object Null]':
			case '[object Boolean]':
				formattedOnes = value
				break;
			case '[object Object]':
			case '[object Array]':
				for (let i in value) {
					try {
						if (value.hasOwnProperty && value.hasOwnProperty(i)) {
							if (loopTimes > 999) {
								value[i] = Object.prototype.toString.call(value[i])
							} else {
								value[i] = formatDataType(value[i], needWarn)
							}
						} else {
							value[i] = Object.prototype.toString.call(value[i])
						}
					} catch (err) {
						value[i] = valueType
					}
				}
				formattedOnes = value
				break;
			case '[object Function]':
				if (needWarn) console.warn("we don't recommend to print function directly", value)
				formattedOnes = Function.prototype.toString.call(value)
				break;
			case '[object Error]':
				formattedOnes = value.stack || value.toString()
				break;
			case '[object Symbol]':
				if (needWarn) console.warn("we don't recommend to print Symbol directly", value)
				formattedOnes = value.toString()
				break;
			case '[object Set]':
				if (needWarn) console.warn("we don't recommend to print Set directly", value)
				formattedOnes = [...value]
				break;
			case '[object Map]':
				if (needWarn) console.warn("we don't recommend to print Map directly", value)
				const obj = {}
				for (let [key, item] of value) {
					obj[key] = item
				}
				formattedOnes = obj
				break;
			default:
				formattedOnes = Object.prototype.toString.call(value)
				break;
		}
	} catch (err) {
		formattedOnes = {}
	}
	return formattedOnes
}
function getTime() {
	const year = new Date().getFullYear();
	const month = new Date().getMonth() + 1;
	const day = new Date().getDate();
	let hour = new Date().getHours();
	let minute = new Date().getMinutes();
	let second = new Date().getSeconds();
	const mileSecond = new Date().getMilliseconds();
	if (hour < 10) {
		hour = "0" + hour
	}
	if (minute < 10) {
		minute = "0" + minute
	}
	if (second < 10) {
		second = "0" + second
	}
	if (mileSecond < 10) {
		second = "00" + mileSecond
	}
	if (mileSecond < 100) {
		second = "0" + mileSecond
	}
	const time = `${year}-${month}-${day} ${hour}:${minute}:${second}.${mileSecond}`;
	return time;
}
let flag = true
function doLogInFile(buffer) {
	buffer && list.push(buffer);
	flag && activate();
}
function activate() {
	flag = false;
	let buffer = list.shift();
	execute(buffer).then(() => new Promise(res => {
		list.length ? activate() : flag = true;
		res();
	}).catch(err => {
		flag = true;
	}));
}
function execute(buffer) {
	return checkFileState()
		.then(() => writeFile(buffer))
		.catch(err => {})
}
function checkFileState() {
	return new Promise((resolve) => {
		fs.stat(LOG_PATH, function (err, stats) {
			if (!fs.existsSync(LOG_PATH)) {
				fs.appendFileSync(LOG_PATH, "");
				resolve();
			} else {
				checkFileSize(stats.size)
					.then(resolve)
			}
		});
	});
}
function checkFileSize(size) {
	return new Promise((resolve) => {
		if (size > LOG_FILE_MAX_SIZE) {
			fs.readdir(path.join(__dirname), (err, files) => {
				if (err) throw err;
				let fileList = files.filter(function (file) {
					return /^server[0-9]*\.log$/i.test(file);
				});
				for (let i = fileList.length; i > 0; i--) {
					if (i >= 10) {
						fs.unlinkSync(path.join(__dirname) + "/" + fileList[i - 1]);
						continue;
					}
					fs.renameSync(path.join(__dirname) + "/" + fileList[i - 1], "server" + i + ".log");
					resolve();
				}
			});
		} else {
			resolve();
		}
	});
}
function writeFile(buffer) {
	return new Promise(function (res) {
		fs.writeFileSync(LOG_PATH, buffer, {
			flag: "a+" //	以读取追加模式打开文件，如果文件不存在则创建。
		});
		res();
	})
}

/**
 * 初始化日志方法
 * @param {*} InitLogger
 */
function InitLogger(config) {
	if (config === undefined || Object.prototype.toString.call(config) === '[object Object]') {
		if (isNodeJs) {
			userConfig = (config || {})
			LOG_FILE_MAX_SIZE = (typeof (userConfig.logFileSize) === 'number' ? userConfig.logFileSize : 1024 * 1024 * 10)
			LOG_PATH = (typeof (userConfig.logFilePath) === 'string' ? userConfig.logFilePath : path.join(__dirname, "../../server.log"))
			ENABLE_DATA_TYPE_WARN = (typeof (userConfig.dataTypeWarn) === 'boolean' ? userConfig.dataTypeWarn : false)
			PRODUCTION_MODEL = (typeof (userConfig.productionModel) === 'boolean' ? userConfig.productionModel : false)
		}
	} else {
		throw new Error("beauty-logger config must be an object")
	}
}

function loggerInFile(level, data, ...args) {
	if(!PRODUCTION_MODEL) console[level].apply(null, Array.prototype.slice.call(arguments).slice(1));
	if (isNodeJs) {
		if (level === "debug") return
		loopTimes = 0
		let dist = deepcopy(data);
		dist = JSON.stringify(dist, function (key, value) {
			return formatDataType(value, ENABLE_DATA_TYPE_WARN)
		}, 4)
		let extend = [];
		if (args.length) {
			extend = args.map(item => dealWithItems(item, ENABLE_DATA_TYPE_WARN));
			if (extend.length) {
				extend = `  [ext] ${extend.join("")}`;
			}
		}
		const content = `${dist}` + `${extend}` + "\r\n";
		return doLogInFile(`[${getTime()}]  [${level.toUpperCase()}]  ${content}`);
	}
}

LOGGER_LEVEL.forEach(function (level) {
	InitLogger.prototype[level] = function (data, ...args) {
		loggerInFile(level, data, ...args);
	}
})

// Export to popular environments boilerplate.
if (typeof define === 'function' && define.amd) {
	define(InitLogger);
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = InitLogger;
} else {
	InitLogger._prevLogger = this.InitLogger;

	InitLogger.noConflict = function () {
		this.InitLogger = InitLogger._prevLogger;
		return InitLogger;
	};

	this.InitLogger = InitLogger;
}
