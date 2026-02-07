import XCTest

class AppUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testSnapshots() {
        let app = XCUIApplication()
        setupSnapshot(app)
        app.launch()

        snapshot("0Launch")

        sleep(3)

        snapshot("1Dashboard")
    }
}
