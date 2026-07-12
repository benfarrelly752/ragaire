// ragaire products — the ONE place products live.
// shop grid, home "latest drop" and the cart all render from this list.
//
// to sell something new: add an entry here, put its image through
// tools/optimize.py, and paste its Stripe Payment Link into `stripe`
// (make one at https://dashboard.stripe.com/payment-links).
// PLACEHOLDER links are detected and shown as "checkout not wired yet".
window.RAGAIRE = window.RAGAIRE || {};
window.RAGAIRE.products = [
    {
        id: "dagda-hat",
        name: "dagda trucker hat",
        price: 30,
        img: "assets/web/dagdahat.png",
        stripe: "https://buy.stripe.com/PLACEHOLDER_dagda_hat",
        soldout: false,
        latest: true
    },
    {
        id: "victim-of-history-tee",
        name: "victim of history tee",
        price: 35,
        img: "assets/web/victimofhistoryshirt.png",
        stripe: "https://buy.stripe.com/PLACEHOLDER_victim_tee",
        soldout: true
    },
    {
        id: "ragaire-zine",
        name: "ragaire zine",
        price: 15,
        img: "assets/web/zine-final.png",
        stripe: "https://buy.stripe.com/PLACEHOLDER_zine",
        soldout: false
    },
    {
        id: "dagda-print",
        name: "dagda print (a3)",
        price: 20,
        img: "assets/web/dagdaad.png",
        stripe: "https://buy.stripe.com/PLACEHOLDER_dagda_print",
        soldout: false
    }
];
