import XCTest

@MainActor
class AppUITests: XCTestCase {

    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = true
        setupSnapshot(app)
        app.launch()
        sleep(4)
    }

    func testAppStoreScreenshots() {
        let webView = app.webViews.firstMatch
        guard webView.waitForExistence(timeout: 10) else { return }

        snapshot("01_Login")

        tapWebLink("Dashboard", in: webView)
        sleep(2)
        snapshot("02_Dashboard")

        tapWebLink("Calendar", in: webView)
        sleep(2)
        snapshot("03_Calendar")

        tapWebLink("Medications", in: webView)
        sleep(2)
        snapshot("04_Medications")

        tapWebLink("Chores", in: webView)
        sleep(2)
        snapshot("05_Chores")

        tapWebLink("Groceries", in: webView)
        sleep(2)
        snapshot("06_Groceries")

        tapWebLink("Reminders", in: webView)
        sleep(2)
        snapshot("07_Reminders")

        tapWebLink("Notifications", in: webView)
        sleep(2)
        snapshot("08_Notifications")

        tapWebLink("Settings", in: webView)
        sleep(2)
        snapshot("09_Settings")

        tapWebLink("Support", in: webView)
        sleep(2)
        snapshot("10_Support")
    }

    private func tapWebLink(_ label: String, in webView: XCUIElement) {
        let link = webView.links[label]
        if link.exists {
            link.tap()
            return
        }

        let staticText = webView.staticTexts[label]
        if staticText.exists {
            staticText.tap()
            return
        }

        let button = webView.buttons[label]
        if button.exists {
            button.tap()
            return
        }
    }
}
