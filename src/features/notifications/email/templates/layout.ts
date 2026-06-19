export function escapeHtml(value: string) {
    return value.replace(
        /[&<>'"]/g,
        (character) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;",
            })[character] ?? character,
    );
}

export function emailLayout({
    heading,
    preview,
    body,
    cta,
}: {
    heading: string;
    preview: string;
    body: string;
    cta?: { label: string; href: string };
}) {
    return `<!doctype html>
            <html>
                <body 
                    style="margin:0;background:#fbf7f2;font-family:Arial,sans-serif;color:#26362f"
                >
                    <div 
                        style="display:none;max-height:0;overflow:hidden"
                    >
                        ${escapeHtml(preview)}
                    </div>
                    <table 
                        role="presentation" 
                        width="100%" 
                        cellpadding="0" 
                        cellspacing="0"
                    >
                        <tr>
                            <td style="padding:32px 16px">
                                <table 
                                    role="presentation" 
                                    width="100%" 
                                    cellpadding="0" 
                                    cellspacing="0" 
                                    style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #eadfd8;border-radius:24px;overflow:hidden"
                                >
                                    <tr>
                                        <td 
                                            style="padding:28px;background:#f8e9e9;text-align:center"
                                        >
                                            <p 
                                                style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#557064"
                                            >
                                                Vee's Nail Studio
                                            </p>
                                            <h1 
                                                style="margin:0;font-size:26px;line-height:1.25"
                                            >
                                                ${escapeHtml(heading)}
                                            </h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td 
                                            style="padding:28px;font-size:15px;line-height:1.65"
                                        >
                                            ${body}${cta ? `<p style="margin:24px 0 0;text-align:center"><a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#294b3d;color:#fff;text-decoration:none;font-weight:700">${escapeHtml(cta.label)}</a></p>` : ""}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td 
                                            style="padding:20px 28px;background:#fbf7f2;text-align:center;font-size:12px;line-height:1.5;color:#6f756f"
                                        >
                                            Vee's Nail Studio<br>Questions? Please contact the studio directly.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>    
            </html>`;
}

export function detailBlock(rows: Array<[string, string]>) {
    return `<div 
                style="margin:20px 0;padding:18px;border-radius:16px;background:#fbf7f2"
            >
                ${rows.map(([label, value]) => `<p style="margin:0 0 8px"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("")}
            </div>`;
}
