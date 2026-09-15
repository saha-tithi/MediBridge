document.addEventListener("DOMContentLoaded", function () {

    const badge = document.getElementById(
        "notificationUnreadBadge"
    );

    if (!badge) {
        return;
    }


    async function loadUnreadCount() {

        try {

            const data = await apiRequest(
                "/notifications/unread-count/"
            );

            const unreadCount =
                data.data?.unread_count ?? 0;


            if (unreadCount > 0) {

                badge.textContent =
                    unreadCount > 99
                        ? "99+"
                        : unreadCount;

                badge.style.display = "flex";

            } else {

                badge.style.display = "none";
            }

        } catch (error) {

            badge.style.display = "none";
        }
    }


    
    loadUnreadCount();


    setInterval(
        loadUnreadCount,
        30000
    );

});