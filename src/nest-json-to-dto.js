const getDataTypeByKey = (key, json) => {
	if (Array.isArray(json[key])) {
		return "array";
	}
	if (!json[key]) {
		return "null";
	}

	return typeof json[key];
};
const getSafeKey = (key) => {
	return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key}"`;
};
const convertToCamelCase = (inputString) => {
	const cleanedString = inputString.replace(/[^a-zA-Z0-9]/g, " ");
	const words = cleanedString.split(" ");
	const camelCaseWords = words.map((word) => {
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	});
	const camelCaseString = camelCaseWords.join("");

	return camelCaseString;
};
const joinDecoratorProps = (props) => {
	return Object.entries(props)
		.map(([key, value]) => `${key}: ${value}`)
		.join(", ");
};

const NestJsonToDto = {
	config: {
		baseClassName: "SampleResponseDto",
		nestApiDecoratorImport: "import { ApiProperty } from '@nestjs/swagger';",
		nestApiDecorator: "@ApiProperty",
		classNamesSeparator: "",
		classNamesSuffix: "",
		newLineCharacter: "\n",
		tabIndentCharacter: "\t",
	},
	body: {},

	setConfig(config) {
		this.config = {
			...this.config,
			...config,
		};
		return this;
	},

	setBody(body) {
		this.body = body;
		return this;
	},

	generate() {
		const genericItemResponse = (key, type, props) => {
			return `${this.config.tabIndentCharacter}${this.config.nestApiDecorator}({ ${joinDecoratorProps(props)} })${
				this.config.newLineCharacter
			}${this.config.tabIndentCharacter}${key}: ${type};${this.config.newLineCharacter}`;
		};
		const handleNumericItems = (key, item, type) => {
			const decoratorProperties = { example: item };

			return genericItemResponse(key, type, decoratorProperties);
		};
		const handleStringItems = (key, item, type) => {
			const decoratorProperties = { example: `"${item}"` };

			return genericItemResponse(key, type, decoratorProperties);
		};
		const handleNullItems = (key, type) => {
			const decoratorProperties = { nullable: true };

			return genericItemResponse(key, type, decoratorProperties);
		};
		const handleBooleanItems = (key, type) => {
			const decoratorProperties = { example: false };

			return genericItemResponse(key, type, decoratorProperties);
		};
		const handleUnknownItems = (key, type) => {
			const decoratorProperties = { type };

			return genericItemResponse(key, type, decoratorProperties);
		};
		const handleArrayItems = (key, type) => {
			let genericType, decoratorType;

			if (type) {
				genericType = `[${type}]`;

				if (type === "string" || type === "number") {
					decoratorType = `[${convertToCamelCase(type)}]`;
				} else {
					decoratorType = `[${type}]`;
				}
			} else {
				genericType = "[]";
				decoratorType = "[]";
			}

			const decoratorProperties = { type: decoratorType };

			return genericItemResponse(key, genericType, decoratorProperties);
		};
		const handleItemByDataType = (props) => {
			props.key = getSafeKey(props.key);

			switch (props.dataType) {
				case "number":
					return handleNumericItems(props.key, props.item, props.dataType);

				case "string":
					return handleStringItems(props.key, props.item, props.dataType);

				case "null":
					return handleNullItems(props.key, props.dataType);

				case "boolean":
					return handleBooleanItems(props.key, props.dataType);

				case "array":
					return handleArrayItems(props.key, props?.innerItemType);

				case "object":
					return handleUnknownItems(props.key, props.className);

				default:
					return handleUnknownItems(props.key, props.type);
			}
		};

		const generateDtos = (json, className) => {
			let response = "";

			response += `class ${className} {${this.config.newLineCharacter}`;

			for (const key in json) {
				if (json.hasOwnProperty(key)) {
					const dataType = getDataTypeByKey(key, json);
					const item = json[key];

					if (dataType === "object") {
						const keytoCamelCase = convertToCamelCase(key);
						const classNameRecursive =
							className + this.config.classNamesSeparator + keytoCamelCase + this.config.classNamesSuffix;
						const recursiveResult = generateDtos(item, classNameRecursive);
						response = recursiveResult + response;
						response += handleItemByDataType({ key, item, dataType, className: classNameRecursive });
					} else if (dataType === "array") {
						if (item[0]) {
							const innerItemType = typeof item[0];

							if (innerItemType === "object") {
								const keytoCamelCase = convertToCamelCase(key);
								const classNameRecursive =
									className + this.config.classNamesSeparator + keytoCamelCase + this.config.classNamesSuffix;
								const recursiveResult = generateDtos(item[0], classNameRecursive);
								response = recursiveResult + response;
								response += handleItemByDataType({ key, item, dataType, innerItemType: classNameRecursive });
							} else {
								response += handleItemByDataType({ key, item, dataType, innerItemType });
							}
						} else {
							response += handleItemByDataType({ key, item, dataType });
						}
					} else {
						response += handleItemByDataType({ key, item, dataType });
					}

					const isLastItem = key === Object.keys(json)[Object.keys(json).length - 1];
					if (!isLastItem) {
						response += this.config.newLineCharacter;
					}
				}
			}

			response += `} ${this.config.newLineCharacter}${this.config.newLineCharacter}`;

			return response;
		};

		const baseClassName = `${this.config.baseClassName}${this.config.classNamesSuffix}`;

		let generatedDTO = "";
		generatedDTO += `${this.config.nestApiDecoratorImport}${this.config.newLineCharacter}${this.config.newLineCharacter}`;
		generatedDTO += generateDtos(this.body, baseClassName);

		return generatedDTO;
	},
};

export default NestJsonToDto;
