const formatNumber = (num) => {
    const fixed = num.toFixed(1)
    return fixed.endsWith('.0') ? parseInt(num).toString() : fixed
}

const formatList = (title, text, titlePadding, valuePadding, unit = '') => {
    if (typeof text === 'number') { text = formatNumber(text) } 
    else if (typeof text === 'string' && !isNaN(text) && text.trim() !== '') { text = formatNumber(parseFloat(text)) }

    title = title.padEnd(titlePadding, ' ')
    text = text.toString().padStart(valuePadding, ' ')
    const formattedUnit = unit ? ` ${unit}` : ''
    const escapedTitle = escapeMarkdownV2(title)
    const escapedText = escapeMarkdownV2(text)
    return `\`${escapedTitle}${escapedText}\`${formattedUnit}`
}

const escapeMarkdownV2 = (text) => {
    if (typeof text === 'number') { text = formatNumber(text) } 
    else if (typeof text === 'string' && !isNaN(text) && text.trim() !== '') { text = formatNumber(parseFloat(text)) }

    return text.replace(/[_*[\]()~`>#+-=|{}.!\\]/g, (x) => '\\' + x)
}

module.exports = { formatList, escapeMarkdownV2 }