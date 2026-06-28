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
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="x-apple-disable-message-reformatting">
        <title>${escapeHtml(heading)}</title>
    </head>
    <body style="margin:0;padding:0;background:#fff7fb;font-family:Arial,Helvetica,sans-serif;color:#2a1b22">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
            ${escapeHtml(preview)}
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#fff7fb">
            <tr>
                <td align="center" style="padding:36px 18px">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px">
                        <tr>
                            <td style="background:#ffffff;border:1px solid #efd3e4;border-radius:24px;padding:32px 24px;text-align:center;box-shadow:0 8px 28px rgba(196,106,138,0.10)">
                                <img src="https://veenailstudio.ca/logo.png" alt="Vee's Nail Studio" width="72" height="72" style="width:72px;height:72px;border-radius:999px;display:block;margin:0 auto 18px">
                                <p style="margin:0 0 8px;color:#8a6677;font-size:13px;letter-spacing:0.04em">
                                    Vee's Nail Studio
                                </p>
                                <h1 style="margin:0;font-size:28px;line-height:1.2;color:#2a1b22">
                                    ${escapeHtml(heading)}
                                </h1>
                                <div style="margin:18px auto 0;max-width:460px;font-size:15px;line-height:1.7;color:#6b4b5a;text-align:left">
                                    ${body}
                                </div>
                                ${
                                    cta
                                        ? `<div style="margin:28px 0 0;text-align:center"><a href="${escapeHtml(cta.href)}" style="display:inline-block;background:#d65d85;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 24px;border-radius:14px">${escapeHtml(cta.label)}</a></div>`
                                        : ""
                                }
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:18px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:#8a6677">
                                This inbox is not actively monitored. For booking changes, design inspo, or appointment questions, please contact us through Instagram or the contact method listed on our website.
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
    return `<div style="margin:20px 0;padding:18px;border:1px solid #efd3e4;border-radius:16px;background:#fff7fb;text-align:left">
        ${rows.map(([label, value], index) => `<p style="margin:0${index === rows.length - 1 ? "" : " 0 8px"};color:#6b4b5a"><strong style="color:#2a1b22">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("")}
    </div>`;
}
