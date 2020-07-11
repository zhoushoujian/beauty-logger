const LOGGER_LEVEL = ["debug", "info", "warn", "error"]
	, isNodeJs = typeof (process) === 'object'

var loopTimes = 0
	, fs
	, path
	, deepcopy;

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
		printFunc[log] = function (...args) {
			logger.apply(null, [`${colors[color]}[${getTime()}] [${info.toUpperCase()}]${colors.Reset} `, ...args, isNodeJs ? colors.Reset : ""])
		}
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
	var formattedOnes = ""
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
				formattedOnes = Array.from(value)
				break;
			case '[object Map]': {
				if (needWarn) console.warn("we don't recommend to print Map directly", value)
				const obj = {}
				value.forEach(function (item, key) {
					obj[key] = item
				})
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
	var hour = new Date().getHours();
	var minute = new Date().getMinutes();
	var second = new Date().getSeconds();
	var mileSecond = new Date().getMilliseconds();
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

function getLogPath(level) {
	const enableMultipleLogFile = this.userConfig.enableMultipleLogFile
	const loggerFilePath = this.userConfig.loggerFilePath
	if (enableMultipleLogFile) {
		return loggerFilePath[level]
	} else {
		return loggerFilePath
	}
}

function logInFile(buffer, level) {
	return checkFileState.bind(this)(level)
		.then(writeFile.bind(this, buffer, level))
}

function checkFileState(level) {
	// check file existed and file size
	const self = this
	return new Promise(function (resolve) {
		const logFileSize = self.userConfig.logFileSize
		const currentProjectFolder = self.userConfig.currentProjectFolder
		if (!fs.existsSync(getLogPath.bind(self)(level))) {
			fs.appendFileSync(getLogPath.bind(self)(level), "");
			return resolve();
		} else {
			fs.stat(getLogPath.bind(self)(level), function (err, stats) {
				if (err) {
					console.debug("beauty-logger: checkFileState fs.stat err", err)
					return resolve();
				} else {
					// logger is async, so one logger has appendFile after next one check file state
					if (stats && (stats.size > logFileSize)) {
						fs.readdir(currentProjectFolder, function (err, files) {
							if (err) console.debug("beauty-logger: checkFileState fs.stat fs.readdir err", err)
							const currentLogFilename = path.parse(getLogPath.bind(self)(level))['name']
							const currentLogFileExtname = path.parse(getLogPath.bind(self)(level))['ext']
							var currentLogFileExtnameWithoutDot
							if (currentLogFileExtname) {
								currentLogFileExtnameWithoutDot = currentLogFileExtname.replace(".", "")
							}
							const fileList = files.filter(function (file) {
								return RegExp("^" + currentLogFilename + '[0-9]*\.*' + currentLogFileExtnameWithoutDot + "*$").test(file)
							});
							for (var i = fileList.length; i > 0; i--) {
								if (i >= 10) {
									fs.unlinkSync(currentProjectFolder + "/" + fileList[i - 1]);
									continue;
								}
								fs.renameSync(currentProjectFolder + "/" + fileList[i - 1], currentLogFilename + i + currentLogFileExtname);
								resolve();
							}
						});
					} else {
						return resolve();
					}
				}
			});
		}
	});
}

function writeFile(buffer, level) {
	const self = this
	return new Promise(function (res) {
		fs.writeFile(getLogPath.bind(self)(level), buffer, {
			flag: "a+"
		}, function (err) {
			if (err) console.debug("beauty-logger: writeFile err", err)
			self.logQueue.shift()
			res(buffer)
			if (self.logQueue.length) {
				const firstItem = self.logQueue[0]
				return logInFile.call(self, firstItem.buffer, firstItem.level)
			}
		});
	})
}

function InitLogger(config = {}) {
	if (Object.prototype.toString.call(config) === '[object Object]') {
		if (isNodeJs) {
			fs = require('fs')
			path = require('path')
			deepcopy = require('./deepcopy')
			this.logQueue = []
			this.userConfig = config
			const currentProjectPath = process.cwd().split("node_modules")[0]
			if (/node_modules/.test(process.cwd())) {
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
			this.userConfig.onlyPrintInConsole = (typeof (this.userConfig.onlyPrintInConsole) === 'boolean' ? this.userConfig.onlyPrintInConsole : false)
			this.userConfig.enableMultipleLogFile = (typeof (this.userConfig.enableMultipleLogFile) === 'boolean' ? this.userConfig.enableMultipleLogFile : true)
			if (!this.userConfig.enableMultipleLogFile) {
				if (typeof (this.userConfig.logFilePath) === 'string') {
					this.userConfig.loggerFilePath = this.userConfig.logFilePath
				} else if (typeof this.userConfig.logFilePath === "undefined") {
					this.userConfig.loggerFilePath = (this.userConfig.currentProjectFolder + "/server.log")
				} else {
					throw new Error("beauty-logger: if enableMultipleLogFile is false, logFilePath must be a string")
				}
			} else {
				if (Object.prototype.toString.call(this.userConfig.logFilePath) === '[object Object]') {
					for (const i in this.userConfig.logFilePath) {
						if (Object.prototype.hasOwnProperty.call(this.userConfig.logFilePath, i)) {
							this.userConfig.loggerFilePath[i] = this.userConfig.logFilePath[i]
						}
					}
				} else if (typeof this.userConfig.logFilePath === "undefined") {
					this.userConfig.loggerFilePath = (this.userConfig.currentProjectFolder + "/server.log")
				} else {
					throw new Error("beauty-logger: if enableMultipleLogFile is true, logFilePath must be an object or empty")
				}
			}
			if (!global.beautyLogger) {
				global.beautyLogger = {}
				global.beautyLogger.userConfig = []
			}
			global.beautyLogger.userConfig.push(this.userConfig)
			global.beautyLogger.userConfig.push(this.logQueue)
		}
	} else {
		throw new Error("beauty-logger: config must be an object or empty")
	}
}

function loggerInFile(level, data = "") {
	if (isNodeJs) {
		const productionModel = this.userConfig.productionModel
		const dataTypeWarn = this.userConfig.dataTypeWarn
		const onlyPrintInConsole = this.userConfig.onlyPrintInConsole
		if (!productionModel) printFunc[level].apply(null, Array.prototype.slice.call(arguments).slice(1));
		if (level === "debug" || onlyPrintInConsole) return
		loopTimes = 0
		var dist = deepcopy(data);
		dist = JSON.stringify(dist, function (key, value) {
			return formatDataType(value, dataTypeWarn)
		}, 4)
		var extend = [];
		const args = Array.prototype.slice.call(arguments).slice(2)
		if (args.length) {
			extend = args.map(function (item) {
				return dealWithItems(item, dataTypeWarn)
			});
			if (extend.length) {
				extend = `  [ext] ${extend.join("")}`;
			}
		}
		const content = `${dist} ${extend} \r\n`;
		const buffer = `[${getTime()}]  [${level.toUpperCase()}]  ${content}`
		if (this.logQueue.length) {
			this.logQueue.push({
				level,
				buffer
			})
			return Promise.resolve(buffer)
		}
		this.logQueue.push({
			level,
			buffer
		})
		return logInFile.call(this, buffer, level);
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
