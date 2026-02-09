import XCTest

@MainActor
class AppUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testSnapshots() {
        let app = XCUIApplication()
        setupSnapshot(app)
        app.launch()

        sleep(3)
        snapshot("01_Login")

        sleep(2)
        snapshot("02_Dashboard")
    }
}
