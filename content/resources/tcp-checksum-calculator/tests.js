function assertEqual(expected, actual) {
    if (expected != actual) {
        throw new Error(`Expected checksum to be 0x${expected.toString(16)}, but got 0x${actual.toString(16)}.`);
    }
}

function runTests() {
    const pkg1 = {
        "src": "192.168.1.1",
        "dst": "192.168.1.2",
        "srcPort": 11500,
        "dstPort": 80,
        "seq": 167320,
        "ack": 0,
        "flags": ["SYN"],
        "window": 8192,
        "urgPtr": 0,
        "payload": null
    };

    assertEqual(0x51B8, calcChecksum(pkg1));

    const pkg2 = {
        "src": "86.105.245.69",
        "dst": "54.208.45.22",
        "srcPort": 64500,
        "dstPort": 7000,
        "seq": 353127008,
        "ack": 19402540,
        "flags": ["SYN", "ACK"],
        "window": 1024,
        "urgPtr": 0,
        "payload": "Hello World!"
    };
    
    assertEqual(0x2335, calcChecksum(pkg2));

    const pkg3 = {
        "src": "86.105.245.69",
        "dst": "54.208.45.22",
        "srcPort": 64500,
        "dstPort": 7000,
        "seq": 353127008,
        "ack": 19402540,
        "flags": ["SYN", "ACK"],
        "window": 1024,
        "urgPtr": 0,
        "payload": "Hello World"
    };

    assertEqual(0x2357, calcChecksum(pkg3));

    return "All tests passed.";
}