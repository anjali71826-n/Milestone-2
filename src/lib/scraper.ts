import gplay from "google-play-scraper";
import store from "app-store-scraper";

export interface Review {
    id: string;
    userName: string;
    userImage?: string;
    date: string;
    score: number;
    title?: string;
    text: string;
    url?: string;
    version?: string;
    source: "google_play" | "app_store";
}

export async function fetchReviews(): Promise<Review[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 84); // Last 12 weeks

    try {
        // Fetch Google Play Reviews
        const gplayReviews = await gplay.reviews({
            appId: "in.indwealth",
            sort: gplay.sort.NEWEST,
            num: 200, // Fetch enough to cover the time range
            lang: "en",
            country: "in",
        });

        const formattedGplayReviews: Review[] = gplayReviews.data.map((r: any) => ({
            id: r.id,
            userName: r.userName,
            userImage: r.userImage,
            date: new Date(r.date).toISOString(),
            score: r.score,
            title: r.title,
            text: r.text,
            url: r.url,
            version: r.version,
            source: "google_play",
        }));

        // Fetch App Store Reviews
        // Note: app-store-scraper returns a promise that resolves to an array
        const appStoreReviews = await store.reviews({
            id: "1450178837", // IND Money App ID
            sort: store.sort.RECENT,
            page: 1,
            country: "in",
        });

        const formattedAppStoreReviews: Review[] = appStoreReviews.map((r: any) => ({
            id: r.id,
            userName: r.userName,
            date: new Date(r.updated).toISOString(),
            score: r.score,
            title: r.title,
            text: r.text,
            source: "app_store",
        }));

        const allReviews = [...formattedGplayReviews, ...formattedAppStoreReviews];

        // Filter by date
        const filteredReviews = allReviews.filter((r) => {
            const reviewDate = new Date(r.date);
            return reviewDate >= startDate && reviewDate <= endDate;
        });

        return filteredReviews;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}
