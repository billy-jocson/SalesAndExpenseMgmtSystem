export const getReportSummary = async ({ startDate, endDate }) => {
	const response = await fetch("/backend/public/index.php/api/reportSummary", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ startDate, endDate }),
	});

	let data;

	try {
		data = await response.json();
	} catch {
		return {
			status: "Error",
			message: `Request failed with status ${response.status}.`,
		};
	}

	if (!response.ok) {
		return { ...data, status: data.status ?? "Error" };
	}

	return data;
};
