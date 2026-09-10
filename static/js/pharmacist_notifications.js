document.addEventListener("DOMContentLoaded", function () {

    const loading = document.getElementById(
        "notificationsLoading"
    );

    const errorBox = document.getElementById(
        "notificationsError"
    );

    const emptyState = document.getElementById(
        "notificationsEmpty"
    );

    const container = document.getElementById(
        "notificationsContainer"
    );

    const markAllReadButton = document.getElementById(
        "markAllReadButton"
    );


    // =========================================================
    // LOAD NOTIFICATIONS
    // =========================================================

    async function loadNotifications() {

        showLoading();

        try {

            const data = await apiRequest(
                "/notifications/"
            );

            const notifications = Array.isArray(data)
    ? data
    : (data.results || data.data || []);
            renderNotifications(
                notifications
            );

        } catch (error) {

            showError(
                error.message ||
                "Unable to load notifications."
            );
        }
    }


    // =========================================================
    // RENDER NOTIFICATIONS
    // =========================================================

    function renderNotifications(
        notifications
    ) {

        loading.style.display = "none";
        errorBox.style.display = "none";

        if (!notifications.length) {

            container.style.display = "none";
            emptyState.style.display = "block";

            return;
        }

        emptyState.style.display = "none";
        container.style.display = "block";

        const groups =
            groupNotificationsByDate(
                notifications
            );

        container.innerHTML = "";

        groups.forEach(function (group) {

            const groupElement =
                document.createElement("div");

            groupElement.className =
                "notification-date-group";

            groupElement.innerHTML = `
                <div class="notification-date-heading">
                    ${escapeHtml(group.label)}
                </div>
            `;

            group.notifications.forEach(
                function (notification) {

                    groupElement.appendChild(
                        createNotificationElement(
                            notification
                        )
                    );
                }
            );

            container.appendChild(
                groupElement
            );
        });
    }


    // =========================================================
    // GROUP NOTIFICATIONS BY DATE
    // =========================================================

    function groupNotificationsByDate(
        notifications
    ) {

        const groups = {};

        notifications.forEach(function (
            notification
        ) {

            const date =
                new Date(
                    notification.created_at
                );

            const key =
                getDateKey(date);

            if (!groups[key]) {

                groups[key] = {
                    date: date,
                    label: getDateLabel(date),
                    notifications: []
                };
            }

            groups[key].notifications.push(
                notification
            );
        });

        return Object.values(groups).sort(
            function (a, b) {
                return b.date - a.date;
            }
        );
    }


    // =========================================================
    // DATE KEY
    // =========================================================

    function getDateKey(date) {

        return [
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        ].join("-");
    }


    // =========================================================
    // DATE LABEL
    // =========================================================

    function getDateLabel(date) {

        const now = new Date();

        const todayKey =
            getDateKey(now);

        const yesterday =
            new Date(now);

        yesterday.setDate(
            yesterday.getDate() - 1
        );

        const yesterdayKey =
            getDateKey(yesterday);

        const dateKey =
            getDateKey(date);


        if (dateKey === todayKey) {
            return "Today";
        }


        if (dateKey === yesterdayKey) {
            return "Yesterday";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }


    // =========================================================
    // CREATE NOTIFICATION ELEMENT
    // =========================================================

    function createNotificationElement(
        notification
    ) {

        const element =
            document.createElement("div");

        const type =
            notification.notification_type;

        const isLowStock =
            type === "LOW_STOCK";

        const isUnread =
            notification.is_read === false;


        element.className =
            "notification-item" +
            (isUnread ? " unread" : "") +
            (isLowStock ? " low-stock" : "");


        element.dataset.id =
            notification.id;


        const icon =
            isLowStock
                ? "!"
                : "↗";


        const unreadDot =
            isUnread
                ? `
                    <span
                        class="notification-unread-dot"
                    ></span>
                `
                : "";


        element.innerHTML = `
            <div class="notification-icon">
                ${icon}
            </div>

            <div class="notification-content">

                <div class="notification-title">

                    ${unreadDot}

                    ${escapeHtml(
                        notification.title
                    )}

                </div>

                <p class="notification-message">
                    ${escapeHtml(
                        notification.message
                    )}
                </p>

            </div>

            <div class="notification-time">
                ${formatNotificationTime(
                    notification.created_at
                )}
            </div>
        `;


        element.addEventListener(
            "click",
            function () {

                openNotification(
                    notification,
                    element
                );
            }
        );


        return element;
    }


    // =========================================================
    // OPEN NOTIFICATION
    // =========================================================

    async function openNotification(
        notification,
        element
    ) {

        /*
         * Mark it as read first.
         *
         * Navigation happens only after the
         * read request succeeds.
         */

        if (!notification.is_read) {

            try {

                await apiRequest(
                    `/notifications/${notification.id}/read/`,
                    {
                        method: "PATCH"
                    }
                );

                notification.is_read = true;

                element.classList.remove(
                    "unread"
                );

                const dot =
                    element.querySelector(
                        ".notification-unread-dot"
                    );

                if (dot) {
                    dot.remove();
                }

            } catch (error) {

                showError(
                    error.message ||
                    "Unable to update notification."
                );

                return;
            }
        }


        // =====================================================
        // NEW ORDER
        // =====================================================

        if (
            notification.notification_type ===
            "NEW_ORDER"
        ) {

            if (notification.order_id) {

                window.location.href =
                    `/pharmacist/orders/${notification.order_id}/`;
            }

            return;
        }


        // =====================================================
        // LOW STOCK
        // =====================================================

        if (
            notification.notification_type ===
            "LOW_STOCK"
        ) {

            window.location.href =
                "/pharmacist/inventory/";

            return;
        }
    }


    // =========================================================
    // MARK ALL AS READ
    // =========================================================

    markAllReadButton.addEventListener(
        "click",
        async function () {

            markAllReadButton.disabled =
                true;

            const originalText =
                markAllReadButton.textContent;

            markAllReadButton.textContent =
                "Updating...";


            try {

                await apiRequest(
                    "/notifications/read-all/",
                    {
                        method: "PATCH"
                    }
                );


                document
                    .querySelectorAll(
                        ".notification-item.unread"
                    )
                    .forEach(function (element) {

                        element.classList.remove(
                            "unread"
                        );

                        const dot =
                            element.querySelector(
                                ".notification-unread-dot"
                            );

                        if (dot) {
                            dot.remove();
                        }
                    });


            } catch (error) {

                showError(
                    error.message ||
                    "Unable to mark notifications as read."
                );

            } finally {

                markAllReadButton.disabled =
                    false;

                markAllReadButton.textContent =
                    originalText;
            }
        }
    );


    // =========================================================
    // FORMAT TIME
    // =========================================================

    function formatNotificationTime(
        createdAt
    ) {

        const date =
            new Date(createdAt);

        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
    }


    // =========================================================
    // LOADING
    // =========================================================

    function showLoading() {

        loading.style.display = "block";

        errorBox.style.display = "none";

        emptyState.style.display = "none";

        container.style.display = "none";
    }


    // =========================================================
    // ERROR
    // =========================================================

    function showError(message) {

        loading.style.display = "none";

        emptyState.style.display = "none";

        container.style.display = "none";

        errorBox.textContent =
            message;

        errorBox.style.display =
            "block";
    }


    // =========================================================
    // HTML ESCAPE
    // =========================================================

    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value ?? "";

        return div.innerHTML;
    }


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    loadNotifications();

});