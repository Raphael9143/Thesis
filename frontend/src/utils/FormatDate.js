const fmtDate = (d) => {
	if (!d) return '';
	try { return new Date(d).toLocaleString(); } catch { return d; }
}

export default fmtDate;