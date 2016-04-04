
namespace JustinCredible.NintendoVsFrontend.Renderer {

    export class Application {

        //#region Injection

        public static ID = "Application";

        public static get $inject(): string[] {
            return [
                "$rootScope",
                "$window",
                "$location",
                "electronRemote",
                Services.Utilities.ID,
                Services.Logger.ID
            ];
        }

        constructor(
            private $rootScope: ng.IRootScopeService,
            private $window: ng.IWindowService,
            private $location: ng.ILocationService,
            private electronRemote: GitHubElectron.Remote,
            private Utilities: Services.Utilities,
            private Logger: Services.Logger) {
        }

        //#endregion

        //#region Private Instance Variables

        /**
         * The root Angular application module.
         */
        private _ngModule: ng.IModule;

        //#endregion

        //#region Public Methods

        /**
         * Used to set the Angular module for the application.
         */
        public setAngularModule(ngModule: ng.IModule): void {
            this._ngModule = ngModule;
        }

        public start(): void {

            // Set the default error handler for all uncaught exceptions.
            this.$window.onerror = _.bind(this.window_onerror, this);

            // Subscribe to browser events.
            this.electronRemote.getCurrentWindow().addListener("player-input", _.bind(this.window_playerInput, this));

            // Subscribe to Angular events.
            this.$rootScope.$on("$locationChangeStart", _.bind(this.angular_locationChangeStart, this));
        }

        //#endregion

        //#region Event Handlers

        public window_playerInput(input: Interfaces.PlayerInput): void {
            this.$rootScope.$broadcast(Constants.PlayerInputEvent, input);
        }

        /**
         * Fired when Angular's route/location (eg URL hash) is changing.
         */
        public angular_locationChangeStart(event: ng.IAngularEvent, newRoute: string, oldRoute: string): void {

            // Chop off the long "file://..." prefix (we only care about the hash tag).
            newRoute = newRoute.substring(newRoute.indexOf("#"));
            oldRoute = oldRoute.substring(oldRoute.indexOf("#"));

            this.Logger.debug("Application", "angular_locationChangeStart", "Angular location changed.", {
                oldRoute: oldRoute,
                newRoute: newRoute
            });
        };

        //#endregion

        //#region Error Handlers

        /**
         * Fired when an unhandled JavaScript exception occurs outside of Angular.
         */
        private window_onerror(message: any, uri: string, lineNumber: number, columnNumber?: number): void {

            // Log the exception using the built-in logger.
            try {
                this.Logger.error("Application", "window_onerror", message, {
                    uri: uri,
                    lineNumber: lineNumber,
                    columnNumber: columnNumber
                });
            }
            catch (ex) {
                // If logging failed there is no use trying to log the failure.
            }
        }

        /**
         * Fired when an exception occurs within Angular.
         * 
         * This includes uncaught exceptions in ng-click methods for example.
         * 
         * This is public so it can be registered via Boot2.ts.
         */
        public angular_exceptionHandler(exception: Error, cause: string): void {

            var message = exception.message;

            if (!message) {
                message = "An unknown error ocurred in an Angular event.";
            }

            if (!cause) {
                cause = "[Unknown]";
            }

            // Log the exception using the built-in logger.
            try {
                this.Logger.error("Application", "angular_exceptionHandler", message, {
                    cause: cause,
                    exception: exception
                });
            }
            catch (ex) {
                // If logging failed there is no use trying to log the failure.
            }
        }

        //#endregion
    }
}
