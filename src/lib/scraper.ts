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

export async function fetchReviews(limit: number = 250): Promise<Review[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 84); // Last 12 weeks

    try {
        // Fetch Google Play Reviews
        // Google Play scraper doesn't support pagination in the same way, but we can request a large number.
        // 3000 is usually the max limit for google-play-scraper per request/batch.
        const gplayReviews = await gplay.reviews({
            appId: "in.indwealth",
            sort: gplay.sort.NEWEST,
            num: 1000, // Increased to ensure coverage
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
        // App Store scraper supports pagination. We'll fetch pages until we hit the date limit.
        let formattedAppStoreReviews: Review[] = [];
        let page = 1;
        let keepFetching = true;

        while (keepFetching && page <= 10) { // Safety limit of 10 pages
            try {
                const appStoreReviews = await store.reviews({
                    id: "1450178837", // IND Money App ID
                    sort: store.sort.RECENT,
                    page: page,
                    country: "in",
                });

                if (!appStoreReviews || appStoreReviews.length === 0) {
                    keepFetching = false;
                    break;
                }

                const pageReviews: Review[] = appStoreReviews.map((r: any) => ({
                    id: r.id,
                    userName: r.userName,
                    date: new Date(r.updated).toISOString(),
                    score: r.score,
                    title: r.title,
                    text: r.text,
                    source: "app_store",
                }));

                // Check if the last review in this batch is older than startDate
                const lastReviewDate = new Date(pageReviews[pageReviews.length - 1].date);
                if (lastReviewDate < startDate) {
                    keepFetching = false;
                }

                formattedAppStoreReviews = [...formattedAppStoreReviews, ...pageReviews];
                page++;
            } catch (e) {
                console.error(`Error fetching App Store page ${page}:`, e);
                keepFetching = false;
            }
        }

        const allReviews = [...formattedGplayReviews, ...formattedAppStoreReviews];

        // Filter by date
        const filteredReviews = allReviews.filter((r) => {
            const reviewDate = new Date(r.date);
            return reviewDate >= startDate && reviewDate <= endDate;
        });

        // Sort by date descending
        filteredReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Limit to requested number
        return filteredReviews.slice(0, limit);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}
