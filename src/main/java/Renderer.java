import core.Scene;
import core.Shader;
import core.body.Camera;
import core.body.Mesh;
import core.err.InvalidUniformLocationException;
import core.loader.ObjectLoader;
import core.util.Util;
import org.joml.Matrix4f;
import org.joml.Vector2f;
import org.joml.Vector3f;
import org.lwjgl.opengl.GL11;
import org.lwjgl.opengl.GL20;
import org.lwjgl.opengl.GL30;

public class Renderer {
    Mesh quad;
    Shader shader;
    Scene scene;
    public void init(Scene scene) {
        this.scene = scene;
        shader = new Shader(Util.loadResourceString(getClass(), "/shader.vert"),
                Util.loadResourceString(getClass(), "/shader.frag"));
        shader.link();
        createUniforms();
        setUniformsDefaultValue();
        shader.validate();
        float[] vertices = {-1, 1, -1, -1, 1, 1, 1, -1};
        quad = ObjectLoader.createQuad(vertices, new float[] {0, 0, 0, 1, 1, 0, 1, 1});
    }

    public void render(Camera camera, Vector2f rotation) {
        shader.bind();
        setUniform("cameraPos", new Vector3f(camera.x, camera.y, -camera.z));
        setUniform("rotation", rotation);
        setUniform("resolution", new Vector2f(scene.window.getWidth(), scene.window.getHeight()));
        setUniform("cameraRot", new Matrix4f().rotateXYZ((float) Math.toRadians(-camera.rotationX), (float) Math.toRadians(-camera.rotationY), (float) Math.toRadians(camera.rotationZ)));

        GL30.glBindVertexArray(quad.getVao());
        GL20.glEnableVertexAttribArray(0);
        GL20.glEnableVertexAttribArray(1);
        GL11.glDrawArrays(GL11.GL_TRIANGLE_STRIP, 0, quad.getVertexCount());
        GL20.glDisableVertexAttribArray(0);
        GL20.glDisableVertexAttribArray(1);
        GL30.glBindVertexArray(0);

        shader.unbind();
    }

    private void createUniforms() {
        createUniform("fractal");
        createUniform("resolution");
        createUniform("cameraPos");
        createUniform("rotation");
        createUniform("cameraRot");
    }

    private void setUniformsDefaultValue() {
        shader.bind();
        setUniform("fractal", Fractals.MANDELBOX);
        setUniform("resolution", new Vector2f(scene.window.getWidth(), scene.window.getHeight()));
        setUniform("cameraPos", new Vector3f(0, 0, 0));
        setUniform("rotation", new Vector2f(0, 0));
        setUniform("cameraRot", new Matrix4f());
        shader.unbind();
    }

    private void setUniform(String uniformName, Object value) {
        try {
            shader.setUniform(uniformName, value);
        } catch (InvalidUniformLocationException | NullPointerException e) {
            System.out.println("Warning: " + uniformName + " : " + value);
        }
    }

    private void createUniform(String uniformName) {
        try {
            shader.createUniform(uniformName);
        } catch (InvalidUniformLocationException e) {
            System.out.println("Warning: " + uniformName);
        }
    }
}
