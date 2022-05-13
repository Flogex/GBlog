'use strict';

function calcChecksum(pkg) {
    function onesComplementSum(a, b) {
        const c = a + b;
        return (c & 0xFFFF) + (c >>> 16);
    }

    const tcpSegment = getTcpSegment(pkg);
    const pseudoHeader = getPseudoHeader(pkg, tcpSegment.length);

    const pseudoDatagram = pseudoHeader.concat(tcpSegment);

    const words = octetsToWords(pseudoDatagram);

    //TODO Add using normal + and shift only the end result
    const sum = words.reduce((acc, current) => onesComplementSum(acc, current));
    const checksum = (~sum) & 0xFFFF;
    
    return checksum;
}

function octetsToWords(octets) {
    if (octets.length % 2 === 1) {
        octets.push(0); // padding
    }

    const result = new Array(octets.length / 2);

    for (let i = 0; i < result.length; i++) {
        result[i] = (octets[2 * i] << 8) + octets[2 * i + 1];
    }

    return result;
}
    
function toOctets(number, count) {
    const words = new Array(count).fill(0);

    let i = count - 1;
    while (i >= 0 && number > 0) {
        words[i] = number & 0xFF;
        number >>>= 8; // >>> is unsigned right shift
        i--;
    }

    return words;
}

function getTcpSegment(pkg) {
    const srcPort = toOctets(pkg.srcPort, 2);
    const dstPort = toOctets(pkg.dstPort, 2);
    const seq = toOctets(pkg.seq, 4);
    const ack = toOctets(pkg.ack, 4);        
    const offset = 5; // No options
    const flags = parseFlags(pkg.flags);
    const window = toOctets(pkg.window, 2);
    const checksum = [0, 0];
    const urgPtr = toOctets(pkg.urgPtr, 2);

    const payload = payloadToOctets(pkg.payload);

    return srcPort.concat(dstPort, seq, ack, (offset << 4), flags, window, checksum, urgPtr, payload);

    function parseFlags(flags) {
        const flagValues = {
            "FIN": 0x01, "SYN": 0x02, "RST": 0x04, "PSH": 0x08,
            "ACK": 0x10, "URG": 0x20, "ECE": 0x40, "CWR": 0x80
        };

        return flags
            .map(f => flagValues[f])
            .reduce((acc, curr) => acc + curr, 0);
    }

    // Transforms payload into array of bytes
    // Currently, there is no way to specify the format from the UI
    function payloadToOctets(payload, format = "utf8") {
        if (!payload)
            return [];

        switch (format) {
            case "utf8": return Array.from(new TextEncoder().encode(payload));
            case "raw": return parseRawBytes(payload);
            default: throw "Unknown format: " + format + ".";
        }
    }

    function parseRawBytes(payload) {
        const bytes = [];

        for (let i = 0; i <= payload.length - 2; i += 2) {
            const b = parseInt(payload.substr(i, 2), 16);
            bytes.push(b);
        }

        return bytes;
    }
}

function getPseudoHeader(pkg, tcpLength) {
    const src = parseIPAddress(pkg.src);
    const dst = parseIPAddress(pkg.dst);
    const reserved = 0;
    const protocol = 6; // TCP
    tcpLength = toOctets(tcpLength, 2);

    return src.concat(dst, reserved, protocol, tcpLength);
    
    function parseIPAddress(addr) {
        return addr.split(".").map(o => o || "0").map(o => parseInt(o));
    }
}