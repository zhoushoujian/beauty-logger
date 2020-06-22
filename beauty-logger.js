const LOGGER_LEVEL = ["debug", "info", "warn", "error"]
, 	isNodeJs = typeof (process) === 'object'

let loopTimes = 0
,	fs
,	path
,	deepcopy;

const printFunc = {}

{
	const colors = {
		Reset: "\x1b[0m",
		FgRed: "\x1b[31m",
		FgGreen: "\x1b[32m",
		FgYellow: isNodeJs ? "\x1b[33m" : "\x1b[43m",
		FgBlue: "\x1b[34m"
	};
	"debug:debug:FgBlue,info:info:FgGreen,warn:warn:FgYellow,error:error:FgRed".split(",").forEach(function (logColor) {
		const [log, info, color] = logColor.split(':');
		const logger = function (...args) {
			console.log(...args)
		}
		printFunc[log] = (...args) => logger.apply(null, [`${colors[color]}[${getTime()}] [${info.toUpperCase()}]${colors.Reset} `, ...args, isNodeJs ? colors.Reset : ""]);
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
				for (const i in value) {
					if (Object.prototype.hasOwnProperty.call(value, i)) {
						if (loopTimes > 999) {
							value[i] = Object.prototype.toString.call(value[i])
						} else {
							value[i] = formatDataType(value[i], needWarn)
						}
					} else {
						value[i] = Object.prototype.toString.call(value[i])
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
			case '[object Map]': {
				if (needWarn) console.warn("we don't recommend to print Map directly", value)
				const obj = {}
				for (const [key, item] of value) {
					obj[key] = item
				}
				formattedOnes = obj
				break;
			}
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
	let mileSecond = new Date().getMilliseconds();
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
		mileSecond = "00" + mileSecond
	}
	if (mileSecond < 100) {
		mileSecond = "0" + mileSecond
	}
	const time = `${year}-${month}-${day} ${hour}:${minute}:${second}.${mileSecond}`;
	return time;
}

function getLogPath(level){
	const { enableMultipleLogFile, loggerFilePath } = this.userConfig
	if(enableMultipleLogFile){
		return loggerFilePath[level]
	} else {
		return loggerFilePath
	}
}

async function logInFile(buffer, level) {
	return checkFileState.bind(this)(level)
		.then(writeFile.bind(this, buffer, level))
}

function checkFileState(level) {
	// check file existed or file size
	return new Promise((resolve) => {
		const { logFileSize, currentProjectFolder } = this.userConfig
		fs.stat(getLogPath.bind(this)(level), function (err, stats) {
			if (!fs.existsSync(getLogPath.bind(this)(level))) {
				fs.appendFileSync(getLogPath.bind(this)(level), "");
				resolve();
			} else {
				// logger is async, so one logger has appendFile after next one check file state
				if (stats && (stats.size > logFileSize)) {
					fs.readdir(currentProjectFolder, (err, files) => {
						const currentLogFilename = path.parse(getLogPath.bind(this)(level))['name']
						const currentLogFileExtname = path.parse(getLogPath.bind(this)(level))['ext']
						let currentLogFileExtnameWithoutDot
						if(currentLogFileExtname){
							currentLogFileExtnameWithoutDot = currentLogFileExtname.replace(".", "")
						}
						const fileList = files.filter(function (file) {
							// eslint-disable-next-line no-useless-escape
							return RegExp("^" + currentLogFilename + '[0-9]*\.*' + currentLogFileExtnameWithoutDot + "*$").test(file)
						});
						for (let i = fileList.length; i > 0; i--) {
							if (i >= 10) {
								fs.unlinkSync(currentProjectFolder + "/" + fileList[i - 1]);
								continue;
							}
							fs.renameSync(currentProjectFolder + "/" + fileList[i - 1], currentLogFilename + i + currentLogFileExtname);
							resolve();
						}
					});
				} else {
					resolve();
				}
			}
		}.bind(this));
	});
}

function writeFile(buffer, level) {
	const self = this
	return new Promise(function (res) {
		fs.writeFileSync(getLogPath.bind(self)(level), buffer, {
			flag: "a+"
		});
		res(buffer);
	})
}

function InitLogger(config) {
	if (!config || Object.prototype.toString.call(config) === '[object Object]') {
		if (isNodeJs) {
			fs = require('fs')
			path = require('path')
			deepcopy = require('./deepcopy')
			this.userConfig = (config || {})
			const currentProjectPath = process.cwd().split("node_modules")[0]
			if(/node_modules/.test(process.cwd())){
				this.userConfig.loggerFilePath = {
					info: currentProjectPath + "info.log",
					warn: currentProjectPath + "warn.log",
					error: currentProjectPath + "error.log",
				}
			} else {
				this.userConfig.loggerFilePath = {
					info: path.join(__dirname, "./info.log"),
					warn: path.join(__dirname, "./warn.log"),
					error: path.join(__dirname, "./error.log"),
				}
			}
			this.userConfig.currentProjectFolder = currentProjectPath
			this.userConfig.logFileSize = (typeof (this.userConfig.logFileSize) === 'number' ? this.userConfig.logFileSize : 1024 * 1024 * 10)
			this.userConfig.dataTypeWarn = (typeof (this.userConfig.dataTypeWarn) === 'boolean' ? this.userConfig.dataTypeWarn : false)
			this.userConfig.productionModel = (typeof (this.userConfig.productionModel) === 'boolean' ? this.userConfig.productionModel : false)
			// if enableMultipleLogFile, logFilePath must be an object and will generate multiple log files, although this.userConfig.logFilePath is a string
			this.userConfig.enableMultipleLogFile = (typeof (this.userConfig.enableMultipleLogFile) === 'boolean' ? this.userConfig.enableMultipleLogFile : false)
			if(Object.prototype.toString.call(this.userConfig.logFilePath) === '[object Object]'){
				for(const i in this.userConfig.logFilePath){
					if(Object.prototype.hasOwnProperty.call(this.userConfig.logFilePath, i)){
						this.userConfig.loggerFilePath[i] = this.userConfig.logFilePath[i]
					}
				}
			}
			if(!this.userConfig.enableMultipleLogFile){
				if(typeof (this.userConfig.logFilePath) === 'string'){
					this.userConfig.loggerFilePath = this.userConfig.logFilePath
				} else if(Object.prototype.toString.call(this.userConfig.logFilePath) === '[object Object]'){
					let hasLogFilePathConfig = false
					for(const i in this.userConfig.logFilePath){
						if(Object.prototype.hasOwnProperty.call(this.userConfig.logFilePath, i)){
							if(['info', 'warn', 'error'].indexOf(i) !== -1){
								this.userConfig.loggerFilePath = this.userConfig.logFilePath[i]
								hasLogFilePathConfig = true
								break;
							}
						}
					}
					if(!hasLogFilePathConfig) this.userConfig.loggerFilePath = (this.userConfig.currentProjectFolder + "/server.log")
				} else {
					this.userConfig.loggerFilePath = (this.userConfig.currentProjectFolder + "/server.log")
				}
			}
			if(!global.beautyLogger){
				global.beautyLogger = {}
				global.beautyLogger.userConfig = []
			}
			global.beautyLogger.userConfig.push(this.userConfig)
		}
	} else {
		throw new Error("beauty-logger config must be an object")
	}
}

function loggerInFile(level, data = "", ...args) {
	if (isNodeJs) {
		const { productionModel, dataTypeWarn } = this.userConfig
		if(!productionModel) printFunc[level].apply(null, Array.prototype.slice.call(arguments).slice(1));
		if (level === "debug") return
		loopTimes = 0
		let dist = deepcopy(data);
		dist = JSON.stringify(dist, function (key, value) {
			return formatDataType(value, dataTypeWarn)
		}, 4)
		let extend = [];
		if (args.length) {
			extend = args.map(item => dealWithItems(item, dataTypeWarn));
			if (extend.length) {
				extend = `  [ext] ${extend.join("")}`;
			}
		}
		const content = `${dist} ${extend} \r\n`;
		return logInFile.bind(this)(`[${getTime()}]  [${level.toUpperCase()}]  ${content}`, level);
	} else {
		printFunc[level].apply(null, Array.prototype.slice.call(arguments).slice(1));
	}
}

LOGGER_LEVEL.forEach(function (level) {
	InitLogger.prototype[level] = function (data, ...args) {
		return loggerInFile.bind(this)(level, data, ...args)
	}
})

// Export to popular environments boilerplate.
// eslint-disable-next-line no-undef
if (typeof define === 'function' && define.amd) {
	// eslint-disable-next-line no-undef
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
