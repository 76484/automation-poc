const PARTNERS = {
    A: {
        partnerId: "A",
        hasDefaultAllInPricing: true,
        url: "http://localhost:3000"
    },
    B: {
        partnerId: "B",
        hasDefaultAllInPricing: false,
        url: "http://localhost:3001"
    }
};

const ACCOUNTS = {
    [PARTNERS.A.partnerId]: {
        id: 1,
        email_address: "aaron.test@vividseats.com",
        first_name: "Aaron"
    },
    [PARTNERS.B.partnerId]: {
        id: 2,
        email_address: "bob.test@vividseats.com",
        first_name: "Bob"
    }
};

const LOCATIONS = {
    CHICAGO: {
        "city": "Chicago",
        "subdivision_code": "IL"
    },
    MONTREAL: {
        "city": "Montreal",
        "subdivision_code": "QC"
    },
    TORONTO: {
        "city": "Toronto",
        "subdivision_code": "ON"
    },
    VANCOUVER: {
        "city": "Vancouver",
        "subdivision_code": "BC"
    }
};

module.exports = {
    ACCOUNTS,
    LOCATIONS,
    PARTNERS
};
