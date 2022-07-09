import core.Display;
import core.Looper;
import core.Window;

public class Main {
    public static void main(String[] args) {
        Display.init();
        Looper.addWindow(new Window(false, 1000, 1000, new MainScene()));
        //Looper.addWindow(new Window(true, Display.primaryDisplay().getWidth(), Display.primaryDisplay().getHeight(), new MainScene()));
        Looper.start(false);
    }
}
