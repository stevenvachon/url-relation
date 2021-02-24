"use strict";

// Browser shim
module.exports =
{
	parseDomain: function()
	{
		return {
			type: this.ParseResultType.Invalid
		};
	},
	ParseResultType:
	{
		Invalid: "INVALID"
	}
};
