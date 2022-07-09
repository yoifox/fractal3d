import core.Scene;
import core.util.Transformation;
import org.joml.Vector2f;
import org.lwjgl.glfw.GLFW;

public class MainScene extends Scene {
    Renderer renderer = new Renderer();
    @Override
    public void onCreate() {
        super.onCreate();
        renderer.init(this);
    }

    Vector2f rotation = new Vector2f();
    @Override
    public void update(float delta) {
        super.update(delta);
        window.setTitle(1f / delta + "");
        if(keyInput.isKeyPressed(GLFW.GLFW_KEY_LEFT))
            rotation.x -= 2f;
        if(keyInput.isKeyPressed(GLFW.GLFW_KEY_RIGHT))
            rotation.x += 2f;
        if(keyInput.isKeyPressed(GLFW.GLFW_KEY_UP))
            rotation.y -= 2f;
        if(keyInput.isKeyPressed(GLFW.GLFW_KEY_DOWN))
            rotation.y += 2f;

        Transformation.moveCamera(mouseInput, keyInput, camera, 0.01f);
        renderer.render(camera, rotation);

        if(keyInput.isKeyJustPressed(GLFW.GLFW_KEY_ESCAPE))
            window.close();
    }
}
